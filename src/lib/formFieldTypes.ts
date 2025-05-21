// File Purpose: This file defines the different types of form fields that users can add, helping the app and AI understand how to handle each field.
// Last updated: 2025-05-21

export interface FormFieldTypeOption {
  label: string; // e.g., "Option 1"
  value: string; // e.g., "option_1"
}

export interface FormFieldType {
  internal_key: string; // The value stored in the database (e.g., 'text', 'number_integer')
  label: string; // User-friendly label for the form builder UI (e.g., 'Single Line Text')
  description: string; // Brief explanation for the form builder
  hasOptions?: boolean; // Does this type require a list of options? (e.g., dropdown, radio)
  // Add other metadata as needed (e.g., icon, validation hints)
}

export const FORM_FIELD_TYPES: FormFieldType[] = [
  // Basic Input Types
  {
    internal_key: 'text',
    label: 'Text (Single Line)',
    description: 'For short text answers like names or subjects.',
  },
  {
    internal_key: 'textarea',
    label: 'Text Area (Multi-Line)',
    description: 'For longer text answers like comments or descriptions.',
  },
  {
    internal_key: 'number_integer',
    label: 'Number (Integer)',
    description: 'For whole numbers (e.g., 1, 42, 100).',
  },
  {
    internal_key: 'number_decimal',
    label: 'Number (Decimal)',
    description: 'For numbers with decimal points (e.g., 3.14, 99.99).',
  },
   {
    internal_key: 'password',
    label: 'Password',
    description: 'For sensitive text input (masked). Not ideal for voice.',
  },
  // Choice / Selection Types
  {
    internal_key: 'checkbox',
    label: 'Checkbox (Yes/No)',
    description: 'A single checkbox for a true/false or yes/no answer.',
  },
  {
    internal_key: 'radio',
    label: 'Radio Buttons (Single Choice)',
    description: 'Select exactly one option from a predefined list.',
    hasOptions: true,
  },
  {
    internal_key: 'dropdown',
    label: 'Dropdown (Single Choice)',
    description: 'Select exactly one option from a dropdown list.',
    hasOptions: true,
  },
  {
    internal_key: 'checkbox_group',
    label: 'Checkboxes (Multiple Choice)',
    description: 'Select one or more options from a predefined list.',
    hasOptions: true,
  },
  {
    internal_key: 'multi_select',
    label: 'Multi-Select Listbox',
    description: 'Select one or more options from a listbox.',
    hasOptions: true,
  },
  // Date & Time Types
  {
    internal_key: 'date',
    label: 'Date',
    description: 'Capture a specific date (Year, Month, Day).',
  },
  {
    internal_key: 'time',
    label: 'Time',
    description: 'Capture a specific time (Hour, Minute).',
  },
  {
    internal_key: 'datetime',
    label: 'Date & Time',
    description: 'Capture both a date and a time together.',
  },
  // Specialized Input Types
  {
    internal_key: 'email',
    label: 'Email Address',
    description: 'For collecting email addresses (includes format check).',
  },
  {
    internal_key: 'url',
    label: 'Website URL',
    description: 'For collecting web addresses/URLs.',
  },
  {
    internal_key: 'phone',
    label: 'Phone Number',
    description: 'For collecting telephone numbers.',
  },
  {
    internal_key: 'currency',
    label: 'Currency',
    description: 'For monetary values (e.g., $10.50).',
  },
  {
    internal_key: 'percentage',
    label: 'Percentage',
    description: 'For capturing a percentage value (e.g., 75%).',
  },
  {
    internal_key: 'rating',
    label: 'Rating / Scale',
    description: 'Select a value on a defined scale (e.g., 1-5 stars). Requires configuration.',
    // Note: 'hasOptions' might be repurposed or extended for scale config (min/max/step)
  },
  {
    internal_key: 'address',
    label: 'Address Block',
    description: 'A multi-line input optimized for capturing street addresses.',
  },
   {
    internal_key: 'file',
    label: 'File Upload',
    description: 'Allow users to upload a file. Not directly usable with voice.',
  },
];

// Helper function to get a type definition by its key
export function getFormFieldType(internal_key: string): FormFieldType | undefined {
  return FORM_FIELD_TYPES.find(type => type.internal_key === internal_key);
}

// Helper function to check if a type requires options
export function fieldTypeRequiresOptions(internal_key: string): boolean {
  const type = getFormFieldType(internal_key);
  return type?.hasOptions ?? false;
} 