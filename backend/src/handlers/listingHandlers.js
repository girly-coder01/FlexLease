import { cvToValue } from '@stacks/transactions';

export async function processListingCreated(event) {
  try {
    const tx = event?.apply?.[0]?.transaction;
    const functionArgs = tx?.metadata?.args || [];

    // Extract function arguments
    const assetId = functionArgs[0] ? cvToValue(functionArgs[0]) : null;
    const dailyRate = functionArgs[1] ? cvToValue(functionArgs[1]) : null;
    const minRentalDays = functionArgs[2] ? cvToValue(functionArgs[2]) : null;

    // Extract transaction details
    const txId = tx?.transaction_identifier?.hash;
    const sender = tx?.metadata?.sender;
    const blockHeight = event?.apply?.[0]?.block_identifier?.index;

    // Get result value (listing-id returned from contract)
    const result = tx?.metadata?.result;
    const listingId = result ? cvToValue(result) : null;

    return {
      listingId,
      assetId,
      dailyRate,
      minRentalDays,
      owner: sender,
      txId,
      blockHeight,
      timestamp: new Date().toISOString(),
      status: 'active'
    };
  } catch (error) {
    console.error('Error processing listing created:', error);
    throw error;
  }
}

export async function processListingUpdated(event) {
  try {
    const tx = event?.apply?.[0]?.transaction;
    const functionArgs = tx?.metadata?.args || [];

    const listingId = functionArgs[0] ? cvToValue(functionArgs[0]) : null;
    const dailyRate = functionArgs[1] ? cvToValue(functionArgs[1]) : null;
    const minRentalDays = functionArgs[2] ? cvToValue(functionArgs[2]) : null;

    return {
      listingId,
      dailyRate,
      minRentalDays,
      updatedBy: tx?.metadata?.sender,
      txId: tx?.transaction_identifier?.hash,
      blockHeight: event?.apply?.[0]?.block_identifier?.index,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error processing listing updated:', error);
    throw error;
  }
}

export async function processListingDeactivated(event) {
  try {
    const tx = event?.apply?.[0]?.transaction;
    const functionArgs = tx?.metadata?.args || [];

    const listingId = functionArgs[0] ? cvToValue(functionArgs[0]) : null;

    return {
      listingId,
      deactivatedBy: tx?.metadata?.sender,
      txId: tx?.transaction_identifier?.hash,
      blockHeight: event?.apply?.[0]?.block_identifier?.index,
      timestamp: new Date().toISOString(),
      status: 'inactive'
    };
  } catch (error) {
    console.error('Error processing listing deactivated:', error);
    throw error;
  }
}
