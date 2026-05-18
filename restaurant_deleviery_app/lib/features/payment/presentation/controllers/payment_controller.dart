import 'package:flutter/material.dart';
import '../../data/datasources/payment_remote_datasource.dart';

class PaymentController extends ChangeNotifier {
  final PaymentRemoteDataSource _dataSource = PaymentRemoteDataSource();
  
  List<dynamic> paymentMethods = [];
  Map<String, dynamic>? selectedMethod;
  bool isLoading = false;
  String? error;

  Future<void> fetchPaymentMethods() async {
    isLoading = true;
    notifyListeners();

    try {
      paymentMethods = await _dataSource.getPaymentMethods();
      if (paymentMethods.isNotEmpty) {
        selectedMethod = paymentMethods.first;
      }
    } catch (e) {
      error = "Failed to load payment methods";
      print(e);
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void selectMethod(Map<String, dynamic> method) {
    selectedMethod = method;
    notifyListeners();
  }

  Future<bool> requestPayment(int orderId, String phone) async {
    if (selectedMethod == null) return false;
    
    isLoading = true;
    notifyListeners();

    try {
      debugPrint("PaymentController: Requesting payment for Order $orderId");
      final result = await _dataSource.createPaymentRequest(
        orderId: orderId,
        method: selectedMethod!['id'],
        phone: phone,
        providerName: selectedMethod!['name'],
      );
      debugPrint("PaymentController: Result received: $result");
      return result != null;
    } catch (e) {
      debugPrint("PaymentController Error: $e");
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }
}
