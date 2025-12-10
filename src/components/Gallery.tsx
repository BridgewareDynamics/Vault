import { ExtractedPage } from '../types';
import { GalleryItem } from './GalleryItem';

interface GalleryProps {
  pages: ExtractedPage[];
  onPageClick: (page: ExtractedPage) => void;
}

export function Gallery({ pages, onPageClick }: GalleryProps) {
  if (pages.length === 0) {
    return null;
  }

  return (
    <div className="w-full h-full overflow-y-auto px-4 py-4 pb-32">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {pages.map((page) => (
          <GalleryItem
            key={page.pageNumber}
            page={page}
            onClick={() => onPageClick(page)}
          />
        ))}
      </div>
    </div>
  );
}



