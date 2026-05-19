import 'package:flutter/material.dart';
import '../../data/datasources/payment_remote_datasource.dart';

class PaymentController extends ChangeNotifier {
  final PaymentRemoteDataSource _dataSource = PaymentRemoteDataSource();

  List<dynamic> paymentMethods = [];
  Map<String, dynamic>? selectedMethod;
  Map<String, dynamic>? lastPayment;

  bool isLoading = false;
  String? error;
  String? successMessage;

  // ── FETCH PAYMENT METHODS ──────────────────────────────────────────────────
  Future<void> fetchPaymentMethods() async {
    isLoading = true;
    error = null;
    notifyListeners();

    try {
      paymentMethods = await _dataSource.getPaymentMethods();
      if (paymentMethods.isNotEmpty) {
        selectedMethod = paymentMethods.first;
      }
    } catch (e) {
      error = 'Failed to load payment methods';
      debugPrint('fetchPaymentMethods error: $e');
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void selectMethod(Map<String, dynamic> method) {
    selectedMethod = method;
    error = null;
    notifyListeners();
  }

  // ── GENERIC PAYMENT REQUEST (EVC, eDahab, ZAAD, SAHAL, cash …) ────────────
  Future<bool> requestPayment(int orderId, String phone) async {
    if (selectedMethod == null) return false;

    isLoading = true;
    error = null;
    notifyListeners();

    try {
      final result = await _dataSource.createPaymentRequest(
        orderId:      orderId,
        method:       selectedMethod!['id'],
        phone:        phone,
        providerName: selectedMethod!['name'],
      );
      if (result != null) {
        lastPayment    = result;
        successMessage = 'Payment request submitted successfully';
        return true;
      }
      error = 'Payment request failed';
      return false;
    } catch (e) {
      error = e.toString();
      debugPrint('requestPayment error: $e');
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  // ── WAAFI DIRECT PAYMENT ──────────────────────────────────────────────────
  /// Pushes a payment request directly to the customer's Waafi phone.
  /// Returns true on success.
  Future<bool> payWithWaafi(int orderId, String phone) async {
    isLoading = true;
    error = null;
    successMessage = null;
    notifyListeners();

    try {
      final result = await _dataSource.processWaafiPayment(
        orderId: orderId,
        phone:   phone,
      );
      lastPayment    = result;
      successMessage = 'Waafi payment successful!';
      return true;
    } catch (e) {
      // e.toString() already contains the backend error message
      error = e.toString().replaceFirst('Exception: ', '');
      debugPrint('payWithWaafi error: $e');
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  // ── CONFIRM PAYMENT (after customer pays manually) ────────────────────────
  Future<bool> confirmPayment(int paymentId, {String? providerRef}) async {
    isLoading = true;
    error = null;
    notifyListeners();

    try {
      final result = await _dataSource.confirmPayment(
        paymentId:   paymentId,
        status:      'paid',
        providerRef: providerRef,
      );
      if (result != null) {
        lastPayment    = result;
        successMessage = 'Payment confirmed!';
        return true;
      }
      error = 'Confirmation failed';
      return false;
    } catch (e) {
      error = e.toString();
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  // ── WAAFI DIRECT CHECKOUT: PAY FIRST, THEN CREATE ORDER ────────────────────
  Future<dynamic> payAndCreateOrder({
    required String type,
    int? tableId,
    int? addressId,
    required List<dynamic> items,
    required String phone,
    required String token,
    String? notes,
  }) async {
    isLoading = true;
    error = null;
    successMessage = null;
    notifyListeners();

    try {
      final orderData = await _dataSource.processCheckoutPayment(
        type: type,
        tableId: tableId,
        addressId: addressId,
        items: items,
        phone: phone,
        token: token,
        notes: notes,
      );
      if (orderData != null) {
        successMessage = 'Payment successful & Order created!';
        return orderData;
      }
      error = 'Checkout failed';
      return null;
    } catch (e) {
      error = e.toString().replaceFirst('Exception: ', '');
      debugPrint('payAndCreateOrder error: $e');
      return null;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void clearState() {
    error          = null;
    successMessage = null;
    lastPayment    = null;
    notifyListeners();
  }
}
