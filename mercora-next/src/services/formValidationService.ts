/**
 * Form Validation Service (STREAM B)
 * Real-time validation for checkout forms
 *
 * Validators:
 * - Email, phone, postal code
 * - Name, address
 * - Credit card (Luhn algorithm)
 * - Custom async validators (email uniqueness, etc)
 */

export type ValidationError = string | null;

export interface FieldValidation {
  isValid: boolean;
  error?: string;
  isValidating?: boolean;
}

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  postalCode?: boolean;
  creditCard?: boolean;
  custom?: (value: any) => ValidationError | Promise<ValidationError>;
}

// Regex patterns
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-\.\+\(\)]+$/,
  postalCode: /^[\da-zA-Z\s\-]{3,10}$/,
  creditCard: /^\d{13,19}$/,
  namePattern: /^[a-zA-Z\s\-']{2,}$/,
  addressLine: /^[a-zA-Z0-9\s\-\.,#]{5,}$/,
};

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationError {
  if (!email) return 'Email is required';
  if (email.length > 254) return 'Email is too long';
  if (!PATTERNS.email.test(email)) return 'Invalid email format';
  return null;
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): ValidationError {
  if (!phone) return 'Phone number is required';
  if (!PATTERNS.phone.test(phone)) return 'Invalid phone number format';

  // Remove non-digits and check length
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return 'Phone number too short';
  if (digits.length > 15) return 'Phone number too long';

  return null;
}

/**
 * Validate postal/zip code
 */
export function validatePostalCode(postalCode: string, country: string): ValidationError {
  if (!postalCode) return 'Postal code is required';

  // Country-specific validation
  switch (country) {
    case 'US':
      if (!/^\d{5}(-\d{4})?$/.test(postalCode)) {
        return 'Invalid US ZIP code (format: 12345 or 12345-6789)';
      }
      break;
    case 'GB':
      if (!/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(postalCode)) {
        return 'Invalid UK postcode';
      }
      break;
    case 'TR':
      if (!/^\d{5}$/.test(postalCode)) {
        return 'Invalid Turkish postal code (5 digits)';
      }
      break;
    case 'DE':
    case 'AT':
      if (!/^\d{5}$/.test(postalCode)) {
        return 'Invalid postal code (5 digits)';
      }
      break;
    default:
      if (!PATTERNS.postalCode.test(postalCode)) {
        return 'Invalid postal code format';
      }
  }

  return null;
}

/**
 * Validate credit card number (Luhn algorithm)
 */
export function validateCreditCard(cardNumber: string): ValidationError {
  if (!cardNumber) return 'Card number is required';

  const digits = cardNumber.replace(/\D/g, '');

  if (!PATTERNS.creditCard.test(digits)) {
    return 'Invalid card number length (13-19 digits)';
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  if (sum % 10 !== 0) {
    return 'Invalid card number (failed Luhn check)';
  }

  return null;
}

/**
 * Validate full name
 */
export function validateName(name: string): ValidationError {
  if (!name) return 'Name is required';
  if (name.length < 2) return 'Name is too short';
  if (name.length > 100) return 'Name is too long';
  if (!PATTERNS.namePattern.test(name)) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes';
  }
  return null;
}

/**
 * Validate address line
 */
export function validateAddressLine(address: string, isRequired = true): ValidationError {
  if (isRequired && !address) return 'Address is required';
  if (address && address.length < 5) return 'Address is too short';
  if (address && address.length > 100) return 'Address is too long';
  if (address && !PATTERNS.addressLine.test(address)) {
    return 'Address contains invalid characters';
  }
  return null;
}

/**
 * Validate city
 */
export function validateCity(city: string): ValidationError {
  if (!city) return 'City is required';
  if (city.length < 2) return 'City name is too short';
  if (city.length > 50) return 'City name is too long';
  if (!/^[a-zA-Z\s\-']{2,}$/.test(city)) {
    return 'City name can only contain letters, spaces, hyphens, and apostrophes';
  }
  return null;
}

/**
 * Validate generic text field
 */
export function validateTextField(
  value: string,
  rules: ValidationRules
): ValidationError {
  if (rules.required && !value) {
    return 'This field is required';
  }

  if (!value) return null;

  if (rules.minLength && value.length < rules.minLength) {
    return `Minimum ${rules.minLength} characters required`;
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    return `Maximum ${rules.maxLength} characters allowed`;
  }

  if (rules.pattern && !rules.pattern.test(value)) {
    return 'Invalid format';
  }

  if (rules.email) {
    return validateEmail(value);
  }

  if (rules.phone) {
    return validatePhone(value);
  }

  if (rules.creditCard) {
    return validateCreditCard(value);
  }

  return null;
}

/**
 * Validate entire checkout form
 */
export function validateCheckoutForm(formData: Record<string, any>): Record<string, ValidationError> {
  const errors: Record<string, ValidationError> = {};

  // Email
  errors.email = validateEmail(formData.email || '');

  // Shipping address
  errors.shippingFirstName = validateName(formData.shippingFirstName || '');
  errors.shippingLastName = validateName(formData.shippingLastName || '');
  errors.shippingAddress1 = validateAddressLine(formData.shippingAddress1 || '');
  errors.shippingCity = validateCity(formData.shippingCity || '');
  errors.shippingPostalCode = validatePostalCode(
    formData.shippingPostalCode || '',
    formData.country || 'US'
  );

  // Phone (optional but validate if provided)
  if (formData.phone) {
    errors.phone = validatePhone(formData.phone);
  }

  // Billing address (if different from shipping)
  if (formData.billingDifferent) {
    errors.billingFirstName = validateName(formData.billingFirstName || '');
    errors.billingLastName = validateName(formData.billingLastName || '');
    errors.billingAddress1 = validateAddressLine(formData.billingAddress1 || '');
    errors.billingCity = validateCity(formData.billingCity || '');
    errors.billingPostalCode = validatePostalCode(
      formData.billingPostalCode || '',
      formData.billingCountry || formData.country || 'US'
    );
  }

  // Filter out null errors
  return Object.fromEntries(
    Object.entries(errors).filter(([, error]) => error !== null)
  );
}

/**
 * Check if form has errors
 */
export function isFormValid(errors: Record<string, ValidationError>): boolean {
  return Object.values(errors).every((error) => error === null || error === undefined);
}

export default {
  validateEmail,
  validatePhone,
  validatePostalCode,
  validateCreditCard,
  validateName,
  validateAddressLine,
  validateCity,
  validateTextField,
  validateCheckoutForm,
  isFormValid,
};
