import 'package:flutter/material.dart';
import 'package:restaurant_delivery_app/features/notifications/data/datasources/notification_remote_datasource.dart';


class NotificationController extends ChangeNotifier {
  final _dataSource = NotificationRemoteDataSource();
  
  List<dynamic> notifications = [];
  bool isLoading = false;
  int? currentCustomerId;

  int get unreadCount => notifications.where((n) => n['isRead'] == false).length;

  void setCustomerId(int customerId) {
    currentCustomerId = customerId;
    notifyListeners();
  }

  Future<void> fetchNotifications() async {
    if (currentCustomerId == null) return;
    
    isLoading = true;
    notifyListeners();

    try {
      notifications = await _dataSource.getCustomerNotifications(currentCustomerId!);
    } catch (e) {
      debugPrint("Fetch Notifications Error: $e");
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchUnreadCount() async {
    if (currentCustomerId == null) return;
    // This could update a separate counter if needed, 
    // but fetchNotifications already gives us the full list.
  }

  Future<void> markAsRead(int id) async {
    try {
      final success = await _dataSource.markAsRead(id);
      if (success) {
        final index = notifications.indexWhere((n) => n['id'] == id);
        if (index != -1) {
          notifications[index]['isRead'] = true;
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint("Mark As Read Error: $e");
    }
  }

  Future<void> markAllAsRead() async {
    if (currentCustomerId == null) return;
    try {
      final success = await _dataSource.markAllAsRead(currentCustomerId!);
      if (success) {
        for (var n in notifications) {
          n['isRead'] = true;
        }
        notifyListeners();
      }
    } catch (e) {
      debugPrint("Mark All As Read Error: $e");
    }
  }
}
