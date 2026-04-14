import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockedState, dismissUpdateMock } = vi.hoisted(() => ({
  mockedState: {
    mockUpdate: null as {
      version: string;
      downloadUrl: string;
      releaseUrl: string;
      publishedAt: string;
    } | null,
  },
  dismissUpdateMock: vi.fn(),
}));

vi.mock('../../../src/infra/update-checker', () => ({
  checkForUpdate: vi.fn(() => Promise.resolve(mockedState.mockUpdate)),
  dismissUpdate: dismissUpdateMock,
  openUpdateLink: vi.fn((update: { releaseUrl: string; downloadUrl: string }) => {
    window.open(update.releaseUrl || update.downloadUrl, '_blank', 'noopener,noreferrer');
    return Promise.resolve();
  }),
}));

import { UpdateBanner } from '../../../src/ui/components/UpdateBanner';

describe('UpdateBanner', () => {
  beforeEach(() => {
    mockedState.mockUpdate = {
      version: '0.4.3',
      downloadUrl: 'https://example.com/app.apk',
      releaseUrl: 'https://github.com/alejandroechev/medical-data-app/releases/tag/v0.4.3',
      publishedAt: '2026-04-14T00:00:00Z',
    };
    dismissUpdateMock.mockReset();
    vi.restoreAllMocks();
  });

  it('opens the update link when Descargar is clicked', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    render(<UpdateBanner />);

    await waitFor(() => {
      expect(screen.getByText(/nueva versión/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Descargar' }));

    expect(openSpy).toHaveBeenCalled();
  });
});
