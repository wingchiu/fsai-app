export const getUserIdentifier = () => {
  if (typeof window === 'undefined') return 'default_user';
  
  let userId = window.localStorage.getItem('user_identifier');
  if (!userId) {
    userId = `user_${Math.random().toString(36).substr(2, 9)}`;
    window.localStorage.setItem('user_identifier', userId);
  }
  return userId;
}; 