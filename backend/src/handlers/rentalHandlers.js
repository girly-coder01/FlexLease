import { cvToValue } from '@stacks/transactions';

export async function processRentalStarted(event) {
  try {
    const tx = event?.apply?.[0]?.transaction;
    const functionArgs = tx?.metadata?.args || [];

    const bookingId = functionArgs[0] ? cvToValue(functionArgs[0]) : null;
    const payment = functionArgs[1] ? cvToValue(functionArgs[1]) : null;
    const deposit = functionArgs[2] ? cvToValue(functionArgs[2]) : null;

    const result = tx?.metadata?.result;
    const agreementId = result ? cvToValue(result) : null;

    return {
      agreementId,
      bookingId,
      payment,
      deposit,
      totalEscrow: payment + deposit,
      renter: tx?.metadata?.sender,
      txId: tx?.transaction_identifier?.hash,
      blockHeight: event?.apply?.[0]?.block_identifier?.index,
      timestamp: new Date().toISOString(),
      status: 'active'
    };
  } catch (error) {
    console.error('Error processing rental started:', error);
    throw error;
  }
}

export async function processRentalCompleted(event) {
  try {
    const tx = event?.apply?.[0]?.transaction;
    const functionArgs = tx?.metadata?.args || [];

    const agreementId = functionArgs[0] ? cvToValue(functionArgs[0]) : null;

    return {
      agreementId,
      completedBy: tx?.metadata?.sender,
      txId: tx?.transaction_identifier?.hash,
      blockHeight: event?.apply?.[0]?.block_identifier?.index,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };
  } catch (error) {
    console.error('Error processing rental completed:', error);
    throw error;
  }
}

export async function processRentalExtended(event) {
  try {
    const tx = event?.apply?.[0]?.transaction;
    const functionArgs = tx?.metadata?.args || [];

    const agreementId = functionArgs[0] ? cvToValue(functionArgs[0]) : null;
    const additionalDays = functionArgs[1] ? cvToValue(functionArgs[1]) : null;
    const additionalPayment = functionArgs[2] ? cvToValue(functionArgs[2]) : null;

    return {
      agreementId,
      additionalDays,
      additionalPayment,
      extendedBy: tx?.metadata?.sender,
      txId: tx?.transaction_identifier?.hash,
      blockHeight: event?.apply?.[0]?.block_identifier?.index,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error processing rental extended:', error);
    throw error;
  }
}
