import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomForm } from '../CustomForm';

// Mock the API service
jest.mock('../../../services/api');

describe('CustomForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all required fields', () => {
    render(
      <CustomForm
        onSubmit={mockOnSubmit}
        loading={false}
        error={null}
        onClearError={mockOnClearError}
      />
    );

    // Check for required fields
    expect(screen.getByLabelText(/Company Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Industry/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Market/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Problem Statement/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Solution/)).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    render(
      <CustomForm
        onSubmit={mockOnSubmit}
        loading={false}
        error={null}
        onClearError={mockOnClearError}
      />
    );

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /Generate Pitch Deck/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Company Name is required')).toBeInTheDocument();
      expect(screen.getByText('Industry is required')).toBeInTheDocument();
      expect(screen.getByText('Target Market is required')).toBeInTheDocument();
      expect(screen.getByText('Problem Statement is required')).toBeInTheDocument();
      expect(screen.getByText('Solution is required')).toBeInTheDocument();
    });

    // Should not call onSubmit
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <CustomForm
        onSubmit={mockOnSubmit}
        loading={false}
        error={null}
        onClearError={mockOnClearError}
      />
    );

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Company Name/), {
      target: { value: 'TechFlow' }
    });
    fireEvent.change(screen.getByLabelText(/Industry/), {
      target: { value: 'Technology' }
    });
    fireEvent.change(screen.getByLabelText(/Target Market/), {
      target: { value: 'Small businesses' }
    });
    fireEvent.change(screen.getByLabelText(/Problem Statement/), {
      target: { value: 'Manual processes are inefficient' }
    });
    fireEvent.change(screen.getByLabelText(/Your Solution/), {
      target: { value: 'Automated workflow platform' }
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Generate Pitch Deck/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        company_name: 'TechFlow',
        industry: 'Technology',
        target_market: 'Small businesses',
        problem_statement: 'Manual processes are inefficient',
        solution: 'Automated workflow platform',
        business_model: '',
        key_features: '',
        competitive_advantage: '',
        team_background: '',
        funding_stage: '',
        traction: ''
      });
    });
  });

  it('displays loading state correctly', () => {
    render(
      <CustomForm
        onSubmit={mockOnSubmit}
        loading={true}
        error={null}
        onClearError={mockOnClearError}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Generating Pitch Deck/ });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Generating Pitch Deck...')).toBeInTheDocument();
  });

  it('displays error message correctly', () => {
    const errorMessage = 'Failed to generate pitch deck';
    
    render(
      <CustomForm
        onSubmit={mockOnSubmit}
        loading={false}
        error={errorMessage}
        onClearError={mockOnClearError}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('validates field length limits', async () => {
    render(
      <CustomForm
        onSubmit={mockOnSubmit}
        loading={false}
        error={null}
        onClearError={mockOnClearError}
      />
    );

    // Fill a field with too many characters
    const longText = 'a'.repeat(501);
    fireEvent.change(screen.getByLabelText(/Company Name/), {
      target: { value: longText }
    });

    // Try to submit
    const submitButton = screen.getByRole('button', { name: /Generate Pitch Deck/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Company Name must be less than 500 characters')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});