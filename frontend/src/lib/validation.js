/**
 * Input Validation & Sanitization Utilities
 */

export const validators = {
  // Email validation
  email: (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return {
      valid: regex.test(value),
      error: 'Invalid email format'
    }
  },

  // Password validation (min 8 chars, uppercase, lowercase, number)
  password: (value) => {
    if (value.length < 8) return { valid: false, error: 'Password must be at least 8 characters' }
    if (!/[A-Z]/.test(value)) return { valid: false, error: 'Password must contain uppercase letter' }
    if (!/[a-z]/.test(value)) return { valid: false, error: 'Password must contain lowercase letter' }
    if (!/[0-9]/.test(value)) return { valid: false, error: 'Password must contain number' }
    return { valid: true }
  },

  // Resume text validation
  resumeText: (value) => {
    if (value.length < 50) return { valid: false, error: 'Resume must be at least 50 characters' }
    if (value.length > 50000) return { valid: false, error: 'Resume is too large (max 50,000 chars)' }
    return { valid: true }
  },

  // Interview answer validation
  answer: (value) => {
    if (value.trim().length < 20) return { valid: false, error: 'Answer must be at least 20 characters' }
    if (value.length > 10000) return { valid: false, error: 'Answer is too long (max 10,000 chars)' }
    return { valid: true }
  },

  // Username validation
  username: (value) => {
    if (value.length < 3) return { valid: false, error: 'Username must be at least 3 characters' }
    if (value.length > 20) return { valid: false, error: 'Username must be less than 20 characters' }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return { valid: false, error: 'Username can only contain letters, numbers, hyphens, underscores' }
    return { valid: true }
  },

  // Phone validation
  phone: (value) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length < 10) return { valid: false, error: 'Phone must be at least 10 digits' }
    return { valid: true }
  }
}

/**
 * Input Sanitization to prevent XSS
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  
  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
}

/**
 * Sanitize HTML to prevent script injection
 */
export function sanitizeHTML(html) {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

/**
 * Validate file size (in MB)
 */
export function validateFileSize(file, maxSizeMB = 10) {
  const maxBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`
    }
  }
  return { valid: true }
}

/**
 * Validate file type
 */
export function validateFileType(file, allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']) {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }
  return { valid: true }
}

/**
 * Batch validation
 */
export function validateForm(formData, rules) {
  const errors = {}
  
  for (const [field, value] of Object.entries(formData)) {
    if (!rules[field]) continue
    
    const validator = rules[field]
    const result = validator(value)
    
    if (!result.valid) {
      errors[field] = result.error
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * API Request Validation
 */
export function validateRequest(req, schema) {
  const errors = {}
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = req[field]
    
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`
      continue
    }
    
    if (rules.type && typeof value !== rules.type) {
      errors[field] = `${field} must be of type ${rules.type}`
      continue
    }
    
    if (rules.minLength && value?.length < rules.minLength) {
      errors[field] = `${field} must be at least ${rules.minLength} characters`
      continue
    }
    
    if (rules.maxLength && value?.length > rules.maxLength) {
      errors[field] = `${field} must be less than ${rules.maxLength} characters`
      continue
    }
    
    if (rules.pattern && !rules.pattern.test(value)) {
      errors[field] = `${field} format is invalid`
      continue
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}
