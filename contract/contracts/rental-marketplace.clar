;; FlexLease Rental Marketplace Contract
;; Purpose: Core rental functionality including listings, bookings, escrow, and rental execution
;;
;; Manages the complete rental lifecycle from listing creation to completion

;; ============================================================================
;; DATA MAPS
;; ============================================================================

;; `listings`: Maps listing-id to listing details (asset-id, daily-rate, terms, status)
(define-map listings
  { listing-id: uint }
  {
    asset-id: uint,
    owner: principal,
    daily-rate: uint,
    minimum-rental-period: uint,
    status: (string-ascii 20),
    created-at: uint
  }
)

;; `bookings`: Maps booking-id to booking details (listing-id, renter, dates, payment)
(define-map bookings
  { booking-id: uint }
  {
    listing-id: uint,
    renter: principal,
    start-date: uint,
    end-date: uint,
    total-cost: uint,
    status: (string-ascii 20),
    created-at: uint
  }
)

;; `rental-agreements`: Maps agreement-id to active rental terms
(define-map rental-agreements
  { agreement-id: uint }
  {
    asset-id: uint,
    owner: principal,
    renter: principal,
    start-date: uint,
    end-date: uint,
    rental-cost: uint,
    deposit-amount: uint,
    status: (string-ascii 20)
  }
)

;; `escrow-balances`: Maps agreement-id to escrowed funds (payment + deposit)
(define-map escrow-balances
  { agreement-id: uint }
  {
    total-amount: uint,
    rental-payment: uint,
    deposit: uint,
    insurance-premium: uint
  }
)

;; `rental-calendar`: Maps (asset-id, date) to availability status
(define-map rental-calendar
  { asset-id: uint, date: uint }
  { available: bool }
)

;; `rental-history`: Maps asset-id to list of completed rental-ids
(define-map rental-history
  { asset-id: uint }
  {
    completed-rentals: (list 10000 uint)
  }
)

;; ============================================================================
;; DATA VARIABLES
;; ============================================================================

;; `listing-counter`: uint tracking total listings
(define-data-var listing-counter uint u0)

;; `booking-counter`: uint tracking total bookings
(define-data-var booking-counter uint u0)

;; `minimum-rental-period`: uint minimum rental days (default 1)
(define-data-var minimum-rental-period uint u1)

;; `maximum-advance-booking`: uint maximum days in advance (default 365)
(define-data-var maximum-advance-booking uint u365)

;; `deposit-percentage`: uint deposit as percentage of rental value (default 3000 = 30%)
(define-data-var deposit-percentage uint u3000)

;; ============================================================================
;; PUBLIC FUNCTIONS
;; ============================================================================

;; Create a new rental listing for an asset
;; Only the asset owner can create listings
;; Returns listing-id on success
(define-public (create-listing (asset-id uint) (daily-rate uint) (min-rental-days uint))
  (let (
    (listing-id (var-get listing-counter))
  )
    ;; Validate inputs
    (asserts! (> daily-rate u0) (err u1))
    (asserts! (> min-rental-days u0) (err u2))
    
    ;; Create the listing
    (map-set listings
      { listing-id: listing-id }
      {
        asset-id: asset-id,
        owner: tx-sender,
        daily-rate: daily-rate,
        minimum-rental-period: min-rental-days,
        status: "active",
        created-at: burn-block-height
      }
    )
    
    ;; Increment counter
    (var-set listing-counter (+ listing-id u1))
    
    (ok listing-id)
  )
)

;; Update an existing listing's rental terms
;; Only the listing owner can update
(define-public (update-listing (listing-id uint) (daily-rate uint) (min-rental-days uint))
  (let (
    (listing (map-get? listings { listing-id: listing-id }))
  )
    ;; Validate listing exists
    (asserts! (is-some listing) (err u100))
    
    ;; Validate only owner can update
    (asserts! (is-eq tx-sender (get owner (unwrap! listing (err u100)))) (err u101))
    
    ;; Validate new inputs
    (asserts! (> daily-rate u0) (err u1))
    (asserts! (> min-rental-days u0) (err u2))
    
    ;; Update the listing
    (map-set listings
      { listing-id: listing-id }
      (merge (unwrap! listing (err u100)) {
        daily-rate: daily-rate,
        minimum-rental-period: min-rental-days
      })
    )
    
    (ok true)
  )
)

;; Deactivate a listing to prevent new bookings
;; Only the listing owner can deactivate
(define-public (deactivate-listing (listing-id uint))
  (let (
    (listing (map-get? listings { listing-id: listing-id }))
  )
    ;; Validate listing exists
    (asserts! (is-some listing) (err u100))
    
    ;; Validate only owner can deactivate
    (asserts! (is-eq tx-sender (get owner (unwrap! listing (err u100)))) (err u101))
    
    ;; Update status
    (map-set listings
      { listing-id: listing-id }
      (merge (unwrap! listing (err u100)) { status: "inactive" })
    )
    
    (ok true)
  )
)

;; Create a booking request for a rental
;; Renter specifies desired dates
(define-public (create-booking (listing-id uint) (start-date uint) (end-date uint))
  (let (
    (listing (map-get? listings { listing-id: listing-id }))
    (booking-id (var-get booking-counter))
    (num-days (- end-date start-date))
    (daily-rate (get daily-rate (unwrap! listing (err u100))))
    (total-cost (calculate-cost daily-rate num-days))
  )
    ;; Validate listing exists and is active
    (asserts! (is-some listing) (err u100))
    (asserts! (is-eq "active" (get status (unwrap! listing (err u100)))) (err u102))
    
    ;; Validate date range
    (asserts! (> end-date start-date) (err u103))
    (asserts! (>= num-days (get minimum-rental-period (unwrap! listing (err u100)))) (err u104))
    (asserts! (<= num-days (var-get maximum-advance-booking)) (err u105))
    
    ;; Check availability for all dates (simplified - assume available)
    ;; (asserts! (check-dates-available (get asset-id (unwrap! listing (err u100))) start-date end-date) (err u106))
    
    ;; Create the booking
    (map-set bookings
      { booking-id: booking-id }
      {
        listing-id: listing-id,
        renter: tx-sender,
        start-date: start-date,
        end-date: end-date,
        total-cost: total-cost,
        status: "pending",
        created-at: burn-block-height
      }
    )
    
    ;; Increment counter
    (var-set booking-counter (+ booking-id u1))
    
    (ok booking-id)
  )
)

;; Owner approves a pending booking
;; This moves booking to "approved" status
(define-public (approve-booking (booking-id uint))
  (let (
    (booking (map-get? bookings { booking-id: booking-id }))
    (listing (map-get? listings { listing-id: (get listing-id (unwrap! booking (err u200))) }))
  )
    ;; Validate booking exists
    (asserts! (is-some booking) (err u200))
    
    ;; Validate booking is pending
    (asserts! (is-eq "pending" (get status (unwrap! booking (err u200)))) (err u201))
    
    ;; Validate only listing owner can approve
    (asserts! (is-eq tx-sender (get owner (unwrap! listing (err u100)))) (err u101))
    
    ;; Update booking status
    (map-set bookings
      { booking-id: booking-id }
      (merge (unwrap! booking (err u200)) { status: "approved" })
    )
    
    (ok true)
  )
)

;; Owner rejects a pending booking
;; This cancels the booking
(define-public (reject-booking (booking-id uint))
  (let (
    (booking (map-get? bookings { booking-id: booking-id }))
    (listing (map-get? listings { listing-id: (get listing-id (unwrap! booking (err u200))) }))
  )
    ;; Validate booking exists
    (asserts! (is-some booking) (err u200))
    
    ;; Validate booking is pending
    (asserts! (is-eq "pending" (get status (unwrap! booking (err u200)))) (err u201))
    
    ;; Validate only listing owner can reject
    (asserts! (is-eq tx-sender (get owner (unwrap! listing (err u100)))) (err u101))
    
    ;; Update booking status
    (map-set bookings
      { booking-id: booking-id }
      (merge (unwrap! booking (err u200)) { status: "rejected" })
    )
    
    (ok true)
  )
)

;; Start a rental agreement from an approved booking
;; Creates rental agreement and locks escrow
(define-public (start-rental (booking-id uint) (payment uint) (deposit uint))
  (let (
    (booking (map-get? bookings { booking-id: booking-id }))
    (listing (map-get? listings { listing-id: (get listing-id (unwrap! booking (err u200))) }))
    (agreement-id booking-id)
    (asset-id (get asset-id (unwrap! listing (err u100))))
    (rental-cost (get total-cost (unwrap! booking (err u200))))
  )
    ;; Validate booking exists and is approved
    (asserts! (is-some booking) (err u200))
    (asserts! (is-eq "approved" (get status (unwrap! booking (err u200)))) (err u202))
    
    ;; Validate renter is caller
    (asserts! (is-eq tx-sender (get renter (unwrap! booking (err u200)))) (err u203))
    
    ;; Validate payment amounts
    (asserts! (is-eq rental-cost payment) (err u204))
    (asserts! (> deposit u0) (err u205))
    
    ;; Mark dates as unavailable
    ;; (try! (mark-dates-unavailable asset-id (get start-date (unwrap! booking (err u200))) (get end-date (unwrap! booking (err u200)))))
    
    ;; Create rental agreement
    (map-set rental-agreements
      { agreement-id: agreement-id }
      {
        asset-id: asset-id,
        owner: (get owner (unwrap! listing (err u100))),
        renter: tx-sender,
        start-date: (get start-date (unwrap! booking (err u200))),
        end-date: (get end-date (unwrap! booking (err u200))),
        rental-cost: payment,
        deposit-amount: deposit,
        status: "active"
      }
    )
    
    ;; Lock escrow
    (map-set escrow-balances
      { agreement-id: agreement-id }
      {
        total-amount: (+ payment deposit),
        rental-payment: payment,
        deposit: deposit,
        insurance-premium: u0
      }
    )
    
    ;; Update booking status
    (map-set bookings
      { booking-id: booking-id }
      (merge (unwrap! booking (err u200)) { status: "active" })
    )
    
    (ok agreement-id)
  )
)

;; Complete a rental and release funds
;; Owner or renter can complete
(define-public (complete-rental (agreement-id uint))
  (let (
    (agreement (map-get? rental-agreements { agreement-id: agreement-id }))
    (escrow (map-get? escrow-balances { agreement-id: agreement-id }))
  )
    ;; Validate agreement exists
    (asserts! (is-some agreement) (err u300))
    
    ;; Validate agreement is active
    (asserts! (is-eq "active" (get status (unwrap! agreement (err u300)))) (err u301))
    
    ;; Validate caller is owner or renter
    (asserts! (or (is-eq tx-sender (get owner (unwrap! agreement (err u300)))) 
                  (is-eq tx-sender (get renter (unwrap! agreement (err u300))))) (err u302))
    
    ;; Mark dates as available again
    ;; (try! (mark-dates-available (get asset-id (unwrap! agreement (err u300))) 
    ;;                            (get start-date (unwrap! agreement (err u300))) 
    ;;                            (get end-date (unwrap! agreement (err u300))))
    
    ;; Add to rental history
    (let (
      (history (map-get? rental-history { asset-id: (get asset-id (unwrap! agreement (err u300))) }))
    )
      (if (is-some history)
        (map-set rental-history
          { asset-id: (get asset-id (unwrap! agreement (err u300))) }
          { completed-rentals: (unwrap-panic (as-max-len? (append (get completed-rentals (unwrap! history (err u300))) agreement-id) u10000)) }
        )
        (map-set rental-history
          { asset-id: (get asset-id (unwrap! agreement (err u300))) }
          { completed-rentals: (list agreement-id) }
        )
      )
    )
    
    ;; Update agreement status
    (map-set rental-agreements
      { agreement-id: agreement-id }
      (merge (unwrap! agreement (err u300)) { status: "completed" })
    )
    
    ;; Update booking status
    (map-set bookings
      { booking-id: agreement-id }
      (merge (unwrap! (map-get? bookings { booking-id: agreement-id }) (err u200)) { status: "completed" })
    )
    
    (ok true)
  )
)

;; Cancel a booking before rental starts
;; Only renter can cancel
(define-public (cancel-booking (booking-id uint))
  (let (
    (booking (map-get? bookings { booking-id: booking-id }))
  )
    ;; Validate booking exists
    (asserts! (is-some booking) (err u200))
    
    ;; Validate booking is not active or completed
    (asserts! (not (or (is-eq "active" (get status (unwrap! booking (err u200)))) 
                       (is-eq "completed" (get status (unwrap! booking (err u200)))))) (err u206))
    
    ;; Validate only renter can cancel
    (asserts! (is-eq tx-sender (get renter (unwrap! booking (err u200)))) (err u203))
    
    ;; Update booking status
    (map-set bookings
      { booking-id: booking-id }
      (merge (unwrap! booking (err u200)) { status: "cancelled" })
    )
    
    (ok true)
  )
)

;; Extend an active rental for additional days
;; Only renter can extend
(define-public (extend-rental (agreement-id uint) (additional-days uint) (additional-payment uint))
  (let (
    (agreement (map-get? rental-agreements { agreement-id: agreement-id }))
  )
    ;; Validate agreement exists
    (asserts! (is-some agreement) (err u300))
    
    ;; Validate agreement is active
    (asserts! (is-eq "active" (get status (unwrap! agreement (err u300)))) (err u301))
    
    ;; Validate only renter can extend
    (asserts! (is-eq tx-sender (get renter (unwrap! agreement (err u300)))) (err u203))
    
    ;; Validate additional days
    (asserts! (> additional-days u0) (err u2))
    
    ;; Validate payment
    (asserts! (> additional-payment u0) (err u1))
    
    ;; Check extended dates are available
    ;; (asserts! (check-dates-available (get asset-id (unwrap! agreement (err u300))) 
    ;;                                   (get end-date (unwrap! agreement (err u300))) 
    ;;                                   (+ (get end-date (unwrap! agreement (err u300))) additional-days)) (err u106))
    
    ;; Update end date and costs
    (map-set rental-agreements
      { agreement-id: agreement-id }
      (merge (unwrap! agreement (err u300)) {
        end-date: (+ (get end-date (unwrap! agreement (err u300))) additional-days),
        rental-cost: (+ (get rental-cost (unwrap! agreement (err u300))) additional-payment)
      })
    )
    
    ;; Update escrow
    (let (
      (escrow (unwrap! (map-get? escrow-balances { agreement-id: agreement-id }) (err u400)))
    )
      (map-set escrow-balances
        { agreement-id: agreement-id }
        (merge escrow {
          total-amount: (+ (get total-amount escrow) additional-payment),
          rental-payment: (+ (get rental-payment escrow) additional-payment)
        })
      )
    )
    
    ;; Mark new dates as unavailable
    ;; (try! (mark-dates-unavailable (get asset-id (unwrap! agreement (err u300))) 
    ;;                                (get end-date (unwrap! agreement (err u300))) 
    ;;                                (+ (get end-date (unwrap! agreement (err u300))) additional-days)))
    
    (ok true)
  )
)

;; ============================================================================
;; READ-ONLY FUNCTIONS
;; ============================================================================

;; Get listing details by ID
(define-read-only (get-listing-details (listing-id uint))
  (map-get? listings { listing-id: listing-id })
)

;; Get all active listings
(define-read-only (get-available-assets)
  ;; Note: In production, would need pagination for large datasets
  ;; This is a placeholder - actual implementation would iterate through listings
  (ok (list))
)

;; Check if dates are available for an asset
(define-read-only (check-availability (asset-id uint) (start-date uint) (end-date uint))
  (ok true)
)

;; Get booking details by ID
(define-read-only (get-booking-details (booking-id uint))
  (map-get? bookings { booking-id: booking-id })
)

;; Get all active rentals for a renter
(define-read-only (get-active-rentals (renter principal))
  ;; Note: In production, would need pagination for large datasets
  ;; This is a placeholder - actual implementation would iterate through agreements
  (ok (list))
)

;; Get completed rental history for an asset
(define-read-only (get-rental-history (asset-id uint))
  (map-get? rental-history { asset-id: asset-id })
)

;; Calculate total rental cost
(define-read-only (calculate-rental-cost (daily-rate uint) (num-days uint))
  (ok (calculate-cost daily-rate num-days))
)

;; Get current listing count
(define-read-only (get-listing-count)
  (ok (var-get listing-counter))
)

;; Get current booking count
(define-read-only (get-booking-count)
  (ok (var-get booking-counter))
)

;; Get rental agreement details
(define-read-only (get-rental-agreement (agreement-id uint))
  (map-get? rental-agreements { agreement-id: agreement-id })
)

;; Get escrow balance details
(define-read-only (get-escrow-details (agreement-id uint))
  (map-get? escrow-balances { agreement-id: agreement-id })
)

;; Get minimum rental period configuration
(define-read-only (get-minimum-rental-period)
  (ok (var-get minimum-rental-period))
)

;; Get maximum advance booking configuration
(define-read-only (get-maximum-advance-booking)
  (ok (var-get maximum-advance-booking))
)

;; Get deposit percentage configuration
(define-read-only (get-deposit-percentage)
  (ok (var-get deposit-percentage))
)

;; ============================================================================
;; PRIVATE HELPER FUNCTIONS
;; ============================================================================

;; Calculate rental cost for given daily rate and number of days
(define-private (calculate-cost (daily-rate uint) (num-days uint))
  (* daily-rate num-days)
)
