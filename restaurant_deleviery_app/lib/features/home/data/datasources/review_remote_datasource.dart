import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../../core/api/api_constants.dart';

class ReviewRemoteDataSource {
  Future<List<dynamic>> getMenuItemReviews(int menuItemId) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}/reviews/$menuItemId'),
      );

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

  Future<dynamic> createReview({
    required int menuItemId,
    required int rating,
    String? comment,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/reviews'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'menuItemId': menuItemId,
          'rating': rating,
          'comment': comment,
        }),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        if (data['success']) {
          return data['data'];
        }
      }
      throw Exception(json.decode(response.body)['message'] ?? 'Failed to post review');
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> checkCanReview(int menuItemId, String token) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}/reviews/check/$menuItemId'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['canReview'] ?? false;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}
