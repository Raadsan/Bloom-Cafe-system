import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../../core/api/api_constants.dart';

class NotificationRemoteDataSource {
  Future<List<dynamic>> getCustomerNotifications(int customerId) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}/notifications/customer/$customerId'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'];
      }
      return [];
    } catch (e) {
      rethrow;
    }
  }

  Future<int> getUnreadCount(int customerId) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}/notifications/customer/$customerId/unread-count'),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['unread'] ?? 0;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }

  Future<bool> markAsRead(int id) async {
    try {
      final response = await http.patch(
        Uri.parse('${ApiConstants.baseUrl}/notifications/$id/read'),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<bool> markAllAsRead(int customerId) async {
    try {
      final response = await http.patch(
        Uri.parse('${ApiConstants.baseUrl}/notifications/customer/$customerId/read-all'),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
