export function getApiErrorMessage(error, fallback = 'Something went wrong.') {
  const validationMessage = error?.response?.data?.errors?.[0]?.message;
  const apiMessage = error?.response?.data?.message;
  const genericMessage = error?.message;

  return validationMessage || apiMessage || genericMessage || fallback;
}
