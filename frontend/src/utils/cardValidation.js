/**
 * Utility for credit card validation (Luhn Algorithm)
 */
export const validateCardNumber = (number) => {
  const digits = number.replace(/\D/g, '');
  if (!digits || digits.length < 13 || digits.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let n = digits.length - 1; n >= 0; n--) {
    let d = parseInt(digits[n], 10);
    if (isEven) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    isEven = !isEven;
  }
  
  return (sum % 10) === 0;
};

/**
 * Validate expiry date (MM/YY)
 */
export const validateExpiryDate = (date) => {
  if (!/^\d{2}\/\d{2}$/.test(date)) return false;
  
  const [month, year] = date.split('/').map(n => parseInt(n, 10));
  if (month < 1 || month > 12) return false;
  
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  
  return true;
};

/**
 * Validate CVV
 */
export const validateCVV = (cvv) => {
  return /^\d{3,4}$/.test(cvv);
};
