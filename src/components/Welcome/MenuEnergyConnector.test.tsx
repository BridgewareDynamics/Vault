import { describe, it, expect } from 'vitest';
import { CardBottomDropBeam, RoundedBeamFrame } from './MenuEnergyConnector';
import { render } from '@testing-library/react';

describe('MenuEnergyConnector branch components', () => {
  const themeProps = {
    isPastel: false,
    primaryRgba: 'rgba(139, 92, 246, ',
    secondaryRgba: 'rgba(34, 211, 238, ',
  };

  it('renders RoundedBeamFrame with child content', () => {
    const { getByText } = render(
      <RoundedBeamFrame {...themeProps} beamBackground="linear-gradient(red, blue)">
        <span>PDF card</span>
      </RoundedBeamFrame>
    );
    expect(getByText('PDF card')).toBeInTheDocument();
  });

  it('renders CardBottomDropBeam as aria-hidden', () => {
    const { container } = render(<CardBottomDropBeam {...themeProps} />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
});
