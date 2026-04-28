import ContentPageTemplate from './ContentPageTemplate.jsx';
import './WelcomeBonusPage.css';

export default function WelcomeBonusPage() {
  return (
    <ContentPageTemplate
      eyebrow="Promotions"
      title="Welcome bonus"
      description="Welcome bonus details will load from the backend."
      endpoint="/bonuses/welcome"
      emptyTitle="No welcome bonus available"
      emptyMessage="Add welcome bonus content in the backend/admin panel to show it here."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
