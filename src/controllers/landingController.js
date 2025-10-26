import { getLandingContent } from '../services/landingService.js';

const renderLanding = (res) => {
  const landingContent = getLandingContent();
  res.render('pages/index', {
    title: 'CRM para Consultorios',
    showPublicHeader: true,
    ...landingContent
  });
};

export const showLanding = (req, res) => {
  if (req.session?.user) {
    return res.redirect('/dashboard');
  }
  renderLanding(res);
};

export const showLandingPublic = (req, res) => {
  renderLanding(res);
};

export default {
  showLanding,
  showLandingPublic
};
