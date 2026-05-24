import ContentPageTemplate from './ContentPageTemplate.jsx';
import './WelcomeBonusPage.css';

export default function WelcomeBonusPage() {
  return (
    <ContentPageTemplate
      eyebrow="Promotions"
      title="Welcome bonus closed"
      description="Welcome bonus is closed. The active promotion is the first-deposit bonus after account information is submitted."
      endpoint="/bonuses/welcome"
      emptyTitle="Welcome bonus closed"
      emptyMessage="Submit your account information first. Your first successful deposit after that can receive a 100% first-deposit bonus."
      actions={[{ to: '/', label: 'Main page' }]}
    />
  );
}
