/**
 * Controller for configuration dashboard
 * Handles configuration panel display for admin users
 */

export const showConfigDashboard = (req, res) => {
  try {
    res.render('pages/dashboardConfig', {
      title: 'Configuración del Sistema',
      isConfigDashboard: true
    });
  } catch (error) {
    res.status(500).render('pages/error', {
      title: 'Error',
      error: 'No se pudo cargar el panel de configuración'
    });
  }
};
