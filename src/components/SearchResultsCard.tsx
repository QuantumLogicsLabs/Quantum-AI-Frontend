import type { SearchHit, SearchResultsPayload } from '../types';
import { isSafeHttpUrl } from '../utils/safeUrl';

const SOURCE_LABEL: Record<SearchHit['source'], string> = {
  google: 'Google',
  youtube: 'YouTube',
  reddit: 'Reddit',
};

interface Props {
  payload: SearchResultsPayload;
}

export function SearchResultsCard({ payload }: Props) {
  if (!payload.results.length) {
    return (
      <section className="search-results-card" aria-label="Live web search results">
        <header>
          <strong>Live search</strong>
          <span>No results for “{payload.query}”</span>
        </header>
      </section>
    );
  }

  return (
    <section className="search-results-card" aria-label="Live web search results">
      <header>
        <strong>Live search</strong>
        <span>
          {payload.results.length} results · Google · YouTube · Reddit · “{payload.query}”
        </span>
      </header>
      <ul>
        {payload.results.map((hit) => {
          const safe = isSafeHttpUrl(hit.url);
          return (
            <li key={`${hit.source}-${hit.url}`}>
              <span className={`search-source-badge source-${hit.source}`}>
                {SOURCE_LABEL[hit.source]}
              </span>
              {safe ? (
                <a href={hit.url} target="_blank" rel="noopener noreferrer">
                  {hit.title}
                </a>
              ) : (
                <span>{hit.title}</span>
              )}
              {hit.snippet ? <p>{hit.snippet}</p> : null}
              {hit.meta ? <small>{hit.meta}</small> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
