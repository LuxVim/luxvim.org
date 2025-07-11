// src/scripts/stimulus.js
import { Application } from '@hotwired/stimulus';

const application = Application.start();
application.debug = import.meta.env.DEV;

// Auto-load all controllers
const controllers = import.meta.glob('../controllers/*_controller.js', { eager: true });

Object.entries(controllers).forEach(([path, module]) => {
  // Extract controller name from filename
  // ../controllers/questionnaire_controller.js -> questionnaire
  const name = path
    .split('/')
    .pop()
    .replace('_controller.js', '');
  
  application.register(name, module.default);
});

if (import.meta.env.DEV) {
  window.Stimulus = application;
}