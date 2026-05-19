import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../../core/api/api_constants.dart';

class ScanRemoteDataSource {
  Future<Map<String, dynamic>?> getTableByQr(String code) async {
    try {
      final response = await http.get(Uri.parse('${ApiConstants.baseUrl}/tables/qr/$code'));
      
      if (response.statusCode == 200) {
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
}
