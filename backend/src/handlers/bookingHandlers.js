import { cvToValue } from '@stacks/transactions';

export async function processBookingCreated(event) {
  try {
    const tx = event?.apply?.[0]?.transaction;
    const functionArgs = tx?.metadata?.args || [];

    const listingId = functionArgs[0] ? cvToValue(functionArgs[0]) : null;
    const startDate = functionArgs[1] ? cvToValue(functionArgs[1]) : null;
    const endDate = functionArgs[2] ? cvToValue(functionArgs[2]) : null;

    const result = tx?.metadata?.result;
    const bookingId = result ? cvToValue(result) : null;

    return {
      bookingId,
      listingId,
      startDate,
      endDate,
      renter: tx?.metadata?.sender,
      txId: tx?.transaction_identifier?.hash,
      blockHeight: event?.apply?.[0]?.block_identifier?.index,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
  } catch (error) {
    console.error('Error processing booking created:', error);
    throw error;
  }
}

export async function processBookingApproved(event) {
  try {
    const tx = event?.apply?.[0]?.transaction;
    const functionArgs = tx?.metadata?.args || [];

    const bookingId = functionArgs[0] ? cvToValue(functionArgs[0]) : null;

    return {
      bookingId,
      approvedBy: tx?.metadata?.sender,
      txId: tx?.transaction_identifier?.hash,
      blockHeight: event?.apply?.[0]?.block_identifier?.index,
      timestamp: new Date().toISOString(),
      status: 'approved'
    };
  } catch (error) {
    console.error('Error processing booking approved:', error);
    throw error;
  }
}

export async function processBookingRejected(event) {
  try {
    const tx = event?.apply?.[0]?.transaction;
    const functionArgs = tx?.metadata?.args || [];

    const bookingId = functionArgs[0] ? cvToValue(functionArgs[0]) : null;

    return {
      bookingId,
      rejectedBy: tx?.metadata?.sender,
      txId: tx?.transaction_identifier?.hash,
      blockHeight: event?.apply?.[0]?.block_identifier?.index,
      timestamp: new Date().toISOString(),
      status: 'rejected'
    };
  } catch (error) {
    console.error('Error processing booking rejected:', error);
    throw error;
  }
}

export async function processBookingCancelled(event) {
  try {
    const tx = event?.apply?.[0]?.transaction;
    const functionArgs = tx?.metadata?.args || [];

    const bookingId = functionArgs[0] ? cvToValue(functionArgs[0]) : null;

    return {
      bookingId,
      cancelledBy: tx?.metadata?.sender,
      txId: tx?.transaction_identifier?.hash,
      blockHeight: event?.apply?.[0]?.block_identifier?.index,
      timestamp: new Date().toISOString(),
      status: 'cancelled'
    };
  } catch (error) {
    console.error('Error processing booking cancelled:', error);
    throw error;
  }
}
