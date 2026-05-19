import 'package:flutter/material.dart';
import '../../data/datasources/review_remote_datasource.dart';

class ReviewController extends ChangeNotifier {
  final ReviewRemoteDataSource _dataSource = ReviewRemoteDataSource();

  List<dynamic> reviews = [];
  bool isLoading = false;
  double averageRating = 0.0;
  bool canReview = false;

  Future<void> fetchReviews(int menuItemId) async {
    isLoading = true;
    notifyListeners();

    try {
      reviews = await _dataSource.getMenuItemReviews(menuItemId);
      _calculateAverageRating();
    } catch (e) {
      print('Error fetching reviews: $e');
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void _calculateAverageRating() {
    if (reviews.isEmpty) {
      averageRating = 0.0;
      return;
    }
    double total = 0;
    for (var review in reviews) {
      total += double.parse(review['rating'].toString());
    }
    averageRating = total / reviews.length;
  }

  Future<bool> addReview({
    required int menuItemId,
    required int rating,
    String? comment,
    required String token,
  }) async {
    try {
      final newReview = await _dataSource.createReview(
        menuItemId: menuItemId,
        rating: rating,
        comment: comment,
        token: token,
      );

      if (newReview != null) {
        reviews.insert(0, newReview);
        _calculateAverageRating();
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      print('Error adding review: $e');
      rethrow;
    }
  }

  Future<void> checkUserEligibility(int menuItemId, String? token) async {
    if (token == null) {
      canReview = false;
      notifyListeners();
      return;
    }
    canReview = await _dataSource.checkCanReview(menuItemId, token);
    notifyListeners();
  }
}
