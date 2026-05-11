import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../../core/api/api_constants.dart';

class AuthRemoteDataSource {
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('${ApiConstants.baseUrl}/auth/login'),
      body: {'email': email, 'password': password},
    );
    return json.decode(response.body);
  }

  Future<Map<String, dynamic>> register(String fullName, String email, String password, String phone) async {
    final response = await http.post(
      Uri.parse('${ApiConstants.baseUrl}/auth/register'),
      body: {
        'fullName': fullName,
        'email': email,
        'password': password,
        'phone': phone,
      },
    );
    return json.decode(response.body);
  }

  Future<Map<String, dynamic>> updateProfile(String token, Map<String, dynamic> updateData) async {
    final response = await http.patch(
      Uri.parse('${ApiConstants.baseUrl}/auth/update-profile'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode(updateData),
    );
    return json.decode(response.body);
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    final response = await http.post(
      Uri.parse('${ApiConstants.baseUrl}/auth/forgot-password'),
      body: {'email': email},
    );
    return json.decode(response.body);
  }

  Future<Map<String, dynamic>> resetPassword(String email, String newPassword) async {
    final response = await http.post(
      Uri.parse('${ApiConstants.baseUrl}/auth/reset-password'),
      body: {'email': email, 'newPassword': newPassword},
    );
    return json.decode(response.body);
  }
}
