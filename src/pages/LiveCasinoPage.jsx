import ContentPageTemplate from './ContentPageTemplate.jsx';
import './LiveCasinoPage.css';

export default function LiveCasinoPage() {
  return (
    <ContentPageTemplate
      eyebrow="Casino"
      title="Live Casino"
      description="Live casino providers and tables will load from the backend."
      endpoint="/casino/live"
      emptyTitle="No live casino available"
      emptyMessage="Add live casino content in the backend/admin panel to show it here."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
