import ContentPageTemplate from './ContentPageTemplate.jsx';
import './SlotsPage.css';

export default function SlotsPage() {
  return (
    <ContentPageTemplate
      eyebrow="Casino"
      title="Slots"
      description=" "
      endpoint="/casino/slots"
      emptyTitle="No slots available"
      emptyMessage=" "
      actions={[{ to: '/jili-games', label: 'JILI games' }, { to: '/', label: 'Main page' }]}
    />
  );
}
