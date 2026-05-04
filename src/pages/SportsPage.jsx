import ContentPageTemplate from './ContentPageTemplate.jsx';
import './SportsPage.css';

export default function SportsPage() {
  return (
    <ContentPageTemplate
      eyebrow="Sportsbook"
      title="Sports"
      description="Sports events, live matches."
      endpoint="/sports/live-matches"
      emptyTitle="No sports available"
      emptyMessage=""
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
