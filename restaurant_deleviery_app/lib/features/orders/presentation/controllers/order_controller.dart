import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../../../core/api/api_constants.dart';
import '../../data/datasources/order_remote_data_source.dart';

class OrderController extends ChangeNotifier {
  final OrderRemoteDataSource _dataSource = OrderRemoteDataSource();
  
  List<dynamic> orders = [];
  bool isLoading = false;
  late IO.Socket socket;

  OrderController() {
    _initSocket();
  }

  void _initSocket() {
    socket = IO.io(ApiConstants.baseUrl.replaceAll('/api', ''), <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': true,
    });

    socket.onConnect((_) {
      print('Connected to socket server');
    });

    socket.on('order_update', (data) {
      print('Order update received: $data');
      _updateOrderInList(data);
    });

    socket.onDisconnect((_) => print('Disconnected from socket server'));
  }

  void _updateOrderInList(dynamic updatedOrder) {
    int index = orders.indexWhere((o) => o['id'] == updatedOrder['id']);
    if (index != -1) {
      orders[index] = updatedOrder;
      notifyListeners();
    } else {
      orders.insert(0, updatedOrder);
      notifyListeners();
    }
  }

  Future<void> fetchOrders(String token) async {
    isLoading = true;
    notifyListeners();

    try {
      final fetchedOrders = await _dataSource.getAllOrders(token);
      orders = fetchedOrders;
      
      // Join rooms for each active order
      for (var order in orders) {
        if (order['status'] != 'served' && order['status'] != 'cancelled') {
          socket.emit('join', 'order_${order['id']}');
        }
      }
    } catch (e) {
      print('Error fetching orders: $e');
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> placeOrder({
    required String type,
    int? tableId,
    int? addressId,
    required List<dynamic> items,
    required String token,
    String? notes,
  }) async {
    isLoading = true;
    notifyListeners();

    try {
      final newOrder = await _dataSource.createOrder(
        type: type,
        tableId: tableId,
        addressId: addressId,
        items: items,
        token: token,
        notes: notes,
      );
      
      if (newOrder != null) {
        orders.insert(0, newOrder);
        socket.emit('join', 'order_${newOrder['id']}');
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      print('Place Order Error: $e');
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    socket.dispose();
    super.dispose();
  }
}
