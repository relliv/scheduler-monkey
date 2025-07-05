import { App } from 'vue'
import tippy from 'tippy.js'

// Import our custom CSS that includes all required Tippy.js styles
import './tippy.css'

export default {
  install: (app: App) => {
    // Make tippy globally available
    app.config.globalProperties.$tippy = tippy
    
    // Add a custom directive for tooltips
    app.directive('tippy', {
      mounted(el, binding) {
        // Get options from directive value
        const options = binding.value || {}
        
        // Create tippy instance
        tippy(el, {
          // Default options
          arrow: true,
          animation: 'scale',
          duration: [275, 200],
          ...options
        })
      },
      unmounted(el) {
        // Clean up tippy instance when element is unmounted
        if (el._tippy) {
          el._tippy.destroy()
        }
      }
    })
  }
}
