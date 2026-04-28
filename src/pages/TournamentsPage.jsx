import ContentPageTemplate from './ContentPageTemplate.jsx';
import './TournamentsPage.css';

export default function TournamentsPage() {
  return (
    <ContentPageTemplate
      eyebrow="Tournaments"
      title="Tournaments"
      description="Tournament list, prizes and status will load from the backend."
      endpoint="/tournaments"
      emptyTitle="No tournaments available"
      emptyMessage="Add tournaments content in the backend/admin panel to show it here."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
