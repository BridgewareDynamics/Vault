import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';
import { ExtractionProgress } from '../types';

describe('ProgressBar', () => {
  const defaultProgress: ExtractionProgress = {
    currentPage: 5,
    totalPages: 10,
    percentage: 50,
  };

  it('should render with progress data', () => {
    render(<ProgressBar progress={defaultProgress} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should display current page and total pages', () => {
    render(<ProgressBar progress={defaultProgress} />);
    expect(screen.getByText('Page 5 of 10')).toBeInTheDocument();
  });

  it('should display default status message when not provided', () => {
    render(<ProgressBar progress={defaultProgress} />);
    expect(screen.getByText('Processing PDF...')).toBeInTheDocument();
  });

  it('should display custom status message when provided', () => {
    render(<ProgressBar progress={defaultProgress} statusMessage="Extracting pages..." />);
    expect(screen.getByText('Extracting pages...')).toBeInTheDocument();
    expect(screen.queryByText('Processing PDF...')).not.toBeInTheDocument();
  });

  it('should handle 0% progress', () => {
    const zeroProgress: ExtractionProgress = {
      currentPage: 0,
      totalPages: 10,
      percentage: 0,
    };
    render(<ProgressBar progress={zeroProgress} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('Page 0 of 10')).toBeInTheDocument();
  });

  it('should handle 100% progress', () => {
    const completeProgress: ExtractionProgress = {
      currentPage: 10,
      totalPages: 10,
      percentage: 100,
    };
    render(<ProgressBar progress={completeProgress} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Page 10 of 10')).toBeInTheDocument();
  });

  it('should not display page numbers when totalPages is 0', () => {
    const noPagesProgress: ExtractionProgress = {
      currentPage: 0,
      totalPages: 0,
      percentage: 0,
    };
    render(<ProgressBar progress={noPagesProgress} />);
    expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should handle progress with no total pages', () => {
    const noTotalProgress: ExtractionProgress = {
      currentPage: 0,
      totalPages: 0,
      percentage: 25,
    };
    render(<ProgressBar progress={noTotalProgress} />);
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
  });

  it('should render progress bar container', () => {
    const { container } = render(<ProgressBar progress={defaultProgress} />);
    const progressContainer = container.querySelector('.w-full.h-6');
    expect(progressContainer).toBeInTheDocument();
  });
});






