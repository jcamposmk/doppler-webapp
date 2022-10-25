import '@testing-library/jest-dom/extend-expect';
import { renderHook } from '@testing-library/react-hooks';
import { useGetBannerData } from '.';

describe('useGetBannerData', () => {
  it('should complete getBannerData with success', async () => {
    // Arrange
    const bannerData = {
      title: 'fake title',
      description: 'fake description',
      backgroundUrl: 'fake background',
      imageUrl: 'fake image',
      functionality: 'fake functionality',
      fontColor: '#000',
    };
    const dopplerSitesClientFake = {
      getBannerData: jest.fn().mockResolvedValue({ success: true, value: bannerData }),
    };
    const props = {
      dopplerSitesClient: dopplerSitesClientFake,
      intl: jest.fn(),
      type: 'signup',
      page: 'dts',
    };

    // Act
    const { result, waitForNextUpdate } = renderHook(() => useGetBannerData(props));

    // Assert
    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.bannerData).toBe(bannerData);
  });
});
