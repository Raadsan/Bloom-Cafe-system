import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../../core/api/api_constants.dart';

class OrderRemoteDataSource {
  Future<List<dynamic>> getAllOrders() async {
    try {
      final response = await http.get(Uri.parse('${ApiConstants.baseUrl}/orders/all'));
      
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
}
