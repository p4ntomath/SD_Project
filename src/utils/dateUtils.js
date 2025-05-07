export const formatDate = (date) => {
  if (!date) return 'Not specified';
  
  try {
    // Handle Firebase timestamp
    if (typeof date === 'object' && date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Handle Date object or date string
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Not specified';
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Not specified';
  }
};

export const formatFirebaseDate = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    // Handle Firebase timestamp object
    if (typeof timestamp === 'object' && timestamp.seconds) {
      const dateObj = new Date(timestamp.seconds * 1000);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Handle regular Date object
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Handle date string
    const dateObj = new Date(timestamp);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    return '';
  } catch (error) {
    console.error('Firebase date formatting error:', error);
    return '';
  }
};