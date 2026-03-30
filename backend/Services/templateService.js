const TEMPLATE_SEEDS = {
  'ML Project': {
    requiredRoles: ['ml', 'backend', 'frontend'],
    defaultTechStack: ['Python', 'Pandas', 'Scikit-learn', 'FastAPI', 'React'],
    starterTasks: [
      'Dataset collection',
      'Exploratory data analysis (EDA)',
      'Feature engineering',
      'Model training',
      'Model evaluation',
      'Deployment',
    ],
    starterMilestones: [
      'Data and EDA ready',
      'Model baseline completed',
      'Deployment and demo ready',
    ],
  },
  'Web App': {
    requiredRoles: ['frontend', 'backend', 'design'],
    defaultTechStack: ['React', 'Node.js', 'Express', 'MongoDB'],
    starterTasks: [
      'Requirements and wireframes',
      'Frontend pages and components',
      'Backend API development',
      'Authentication and authorization',
      'Integration testing',
      'Deployment',
    ],
    starterMilestones: [
      'UI prototype completed',
      'API + database completed',
      'End-to-end flow and deployment',
    ],
  },
  'Mobile App': {
    requiredRoles: ['frontend', 'backend', 'design'],
    defaultTechStack: ['React Native', 'Node.js', 'Express', 'MongoDB'],
    starterTasks: [
      'User journey and app screens',
      'Mobile UI implementation',
      'Backend API development',
      'Push notifications and offline handling',
      'Device testing',
      'Release build',
    ],
    starterMilestones: [
      'Core screens completed',
      'API integration completed',
      'Testing and release ready',
    ],
  },
};

function getTemplateSeed(templateType = '') {
  return TEMPLATE_SEEDS[templateType] || null;
}

module.exports = {
  getTemplateSeed,
};