export const screenConfig = {

  // Default — transparent so the global background image shows through
  window: {
    headerShown:  false,
    animation:    'none' as const,
    gestureEnabled: false,
    contentStyle: { backgroundColor: '#06111f' },
  },

  // Fade — auth transitions
  fade: {
    animation:         'fade' as const,
    animationDuration: 300,
    gestureEnabled:    false,
    contentStyle:      { backgroundColor: '#06111f' },
  },

  // Profile / License — fade in like the rest of the app
  slideUp: {
    animation:         'fade' as const,
    animationDuration: 250,
    gestureEnabled:    true,
    contentStyle:      { backgroundColor: '#06111f' },
  },
};
