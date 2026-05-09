import 'package:flutter/material.dart';
import 'package:get_storage/get_storage.dart';
import 'package:restaurant_delivery_app/features/auth/data/datasources/auth_remote_datasource.dart';

class AuthController extends ChangeNotifier {
  final _storage = GetStorage();
  final _dataSource = AuthRemoteDataSource();
  
  Map<String, dynamic>? user;
  String? token;
  bool isLoading = false;

  AuthController() {
    _loadUser();
  }

  void _loadUser() {
    token = _storage.read('token');
    final userData = _storage.read('user');
    if (userData != null) {
      user = Map<String, dynamic>.from(userData);
    }
    notifyListeners();
  }

  bool get isAuthenticated => token != null;

  Future<bool> login(String email, String password) async {
    isLoading = true;
    notifyListeners();

    try {
      final data = await _dataSource.login(email, password);
      debugPrint("Login Response: $data");
      if (data['success']) {
        token = data['token'];
        user = data['user'];
        await _storage.write('token', token);
        await _storage.write('user', user);
        return true;
      }
      return false;
    } catch (e) {
      debugPrint("Login Error: $e");
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> register(String fullName, String email, String password, String phone) async {
    isLoading = true;
    notifyListeners();

    try {
      final data = await _dataSource.register(fullName, email, password, phone);
      debugPrint("Register Response: $data");
      if (data['success']) {
        token = data['token'];
        user = data['user'];
        await _storage.write('token', token);
        await _storage.write('user', user);
        return true;
      }
      return false;
    } catch (e) {
      debugPrint("Register Error: $e");
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateProfile(Map<String, dynamic> updateData) async {
    if (token == null) return false;
    isLoading = true;
    notifyListeners();

    try {
      final data = await _dataSource.updateProfile(token!, updateData);
      debugPrint("Update Profile Response: $data");
      if (data['success']) {
        user = data['user'];
        await _storage.write('user', user);
        return true;
      }
      return false;
    } catch (e) {
      debugPrint("Update Profile Error: $e");
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> forgotPassword(String email) async {
    isLoading = true;
    notifyListeners();
    try {
      final data = await _dataSource.forgotPassword(email);
      debugPrint("Forgot Password Response: $data");
      return data['success'];
    } catch (e) {
      debugPrint("Forgot Password Error: $e");
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> resetPassword(String email, String newPassword) async {
    isLoading = true;
    notifyListeners();
    try {
      final data = await _dataSource.resetPassword(email, newPassword);
      debugPrint("Reset Password Response: $data");
      return data['success'];
    } catch (e) {
      debugPrint("Reset Password Error: $e");
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void logout() {
    token = null;
    user = null;
    _storage.remove('token');
    _storage.remove('user');
    notifyListeners();
  }
}
