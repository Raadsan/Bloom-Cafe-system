class ApiConstants {
  // Use 10.0.2.2 for Android emulator to access localhost of the machine
  static const String baseUrl = 'http://192.168.8.245:5000/api';
  
  // Endpoints
  static const String categories = '/categories/all';
  static const String menuItems = '/menu-items/all';
  static const String menuItemsByCategory = '/menu-items/category/';
}
