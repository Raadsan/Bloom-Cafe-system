import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../../core/api/api_constants.dart';
import '../models/category_model.dart';

class HomeRemoteDataSource {
  Future<List<CategoryModel>> getCategories() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}${ApiConstants.categories}'),
      );

      if (response.statusCode == 200) {
        print(response.body);
        print(response.statusCode);
        final Map<String, dynamic> data = json.decode(response.body);
        final List<dynamic> categoriesJson = data['data'];
        return categoriesJson
            .map((json) => CategoryModel.fromJson(json))
            .toList();
      } else {
        throw Exception('Failed to load categories');
      }
    } catch (e) {
      print(e);
      throw Exception('Error fetching categories: $e');
    }
  }

  Future<List<dynamic>> getMenuItems() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}${ApiConstants.menuItems}'),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        return data['data'] as List<dynamic>;
      } else {
        throw Exception('Failed to load menu items');
      }
    } catch (e) {
      throw Exception('Error fetching menu items: $e');
    }
  }

  Future<List<dynamic>> getMenuItemsByCategory(int categoryId) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}${ApiConstants.menuItemsByCategory}$categoryId'),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        return data['data'] as List<dynamic>;
      } else {
        throw Exception('Failed to load menu items for category $categoryId');
      }
    } catch (e) {
      throw Exception('Error fetching menu items by category: $e');
    }
  }
}
