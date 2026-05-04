import ContentPageTemplate from './ContentPageTemplate.jsx';
import './WelcomeBonusPage.css';

export default function WelcomeBonusPage() {
  return (
    <ContentPageTemplate
      eyebrow="Promotions"
      title="Welcome bonus"
      description="Welcome bonus details."
      endpoint="/bonuses/welcome"
      emptyTitle="No welcome bonus available"
      emptyMessage=""
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
