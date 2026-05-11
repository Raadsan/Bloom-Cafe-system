import 'package:flutter/material.dart';
import 'package:get_storage/get_storage.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../../../core/api/api_constants.dart';

class CartController extends ChangeNotifier {
  final _storage = GetStorage();
  
  bool isLoading = false;
  String? error;
  
  // Format: [ { "menuItemId": 1, "quantity": 1, "menuItem": { ... } }, ... ]
  List<dynamic> cartItems = [];
  Map<String, dynamic>? currentTable;

  CartController() {
    _loadLocalCart();
  }

  void setTable(Map<String, dynamic> table) {
    currentTable = table;
    notifyListeners();
  }

  void clearTable() {
    currentTable = null;
    notifyListeners();
  }

  void _loadLocalCart() {
    final storedCart = _storage.read('local_cart');
    if (storedCart != null) {
      cartItems = List<dynamic>.from(storedCart);
    }
    notifyListeners();
  }

  void _saveLocalCart() {
    _storage.write('local_cart', cartItems);
    notifyListeners();
  }

  Future<bool> addToCart(int menuItemId, {int quantity = 1}) async {
    isLoading = true;
    notifyListeners();

    try {
      // Check if already in cart
      final existingIndex = cartItems.indexWhere((item) => item['menuItemId'] == menuItemId);
      if (existingIndex != -1) {
        cartItems[existingIndex]['quantity'] += quantity;
      } else {
        // Fetch product details from backend to save in cart
        final response = await http.get(Uri.parse('${ApiConstants.baseUrl}/menu-items/all'));
        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          final items = data['data'] as List;
          final menuItem = items.firstWhere((item) => item['id'] == menuItemId, orElse: () => null);
          
          if (menuItem != null) {
            cartItems.add({
              'menuItemId': menuItemId,
              'quantity': quantity,
              'menuItem': menuItem,
            });
          }
        }
      }
      _saveLocalCart();
      isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      error = e.toString();
      isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void removeCartItem(int menuItemId) {
    cartItems.removeWhere((item) => item['menuItemId'] == menuItemId);
    _saveLocalCart();
  }

  void clearCart() {
    cartItems.clear();
    _saveLocalCart();
  }

  void updateQuantity(int menuItemId, int newQuantity) {
    if (newQuantity <= 0) {
      removeCartItem(menuItemId);
      return;
    }
    final index = cartItems.indexWhere((item) => item['menuItemId'] == menuItemId);
    if (index != -1) {
      cartItems[index]['quantity'] = newQuantity;
      _saveLocalCart();
    }
  }

  bool isItemInCart(int menuItemId) {
    return cartItems.any((item) => item['menuItemId'] == menuItemId);
  }
}
