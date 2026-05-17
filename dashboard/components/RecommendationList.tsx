interface RecommendationItem {
  itemId: string;
  score: number;
  path?: string[];
}

interface RecommendationListProps {
  items: RecommendationItem[];
}

export function RecommendationList({ items }: RecommendationListProps): JSX.Element {
  return (
    <div className="card recommendation-card">
      <div className="card-title">Recommended Items</div>
      {items.length === 0 ? (
        <div className="empty-state">No recommendations for the current selection.</div>
      ) : (
        <ul className="recommendation-list">
          {items.map((item) => (
            <li key={item.itemId}>
              <div className="rec-item">
                <div className="rec-title">{item.itemId}</div>
                <div className="rec-score">Score: {item.score.toFixed(3)}</div>
              </div>
              {item.path ? (
                <div className="rec-path">{item.path.join(" -> ")}</div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
