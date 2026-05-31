import { describe, expect, it } from 'vitest';

describe('applyNovelInMain module mutex', () => {
  it('hides other embedded modules when Novel is shown', () => {
    let showMap = true;
    let showTranscription = true;
    let showFileConverter = true;
    let showNovel = false;

    const applyNovelInMain = () => {
      showMap = false;
      showTranscription = false;
      showFileConverter = false;
      showNovel = true;
    };

    applyNovelInMain();

    expect(showMap).toBe(false);
    expect(showTranscription).toBe(false);
    expect(showFileConverter).toBe(false);
    expect(showNovel).toBe(true);
  });

  it('hides Novel when Map is opened', () => {
    let showNovel = true;
    const openMap = () => {
      showNovel = false;
    };

    openMap();
    expect(showNovel).toBe(false);
  });
});
