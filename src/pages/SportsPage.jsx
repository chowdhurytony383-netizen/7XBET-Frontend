import ContentPageTemplate from './ContentPageTemplate.jsx';
import './SportsPage.css';

export default function SportsPage() {
  return (
    <ContentPageTemplate
      eyebrow="Sportsbook"
      title="Sports"
      description="Sports events, live matches and odds will load from the backend."
      endpoint="/sports/live-matches"
      emptyTitle="No sports available"
      emptyMessage="Add sports content in the backend/admin panel to show it here."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
