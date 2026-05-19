import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../../core/api/api_constants.dart';

class AddressRemoteDataSource {
  Future<List<dynamic>> getAddresses(int customerId) async {
    try {
      final response = await http.get(Uri.parse('${ApiConstants.baseUrl}/addresses/customer/$customerId'));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success']) {
          return data['data'] ?? [];
        }
      }
      return [];
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>?> saveAddress(Map<String, dynamic> addressData) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/addresses'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(addressData),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        if (data['success']) {
          return data['data'];
        }
      }
      return null;
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> setDefaultAddress(int addressId) async {
    try {
      final response = await http.patch(
        Uri.parse('${ApiConstants.baseUrl}/addresses/$addressId/default'),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
