import 'package:flutter/material.dart';
import '../../data/datasources/address_remote_datasource.dart';

class AddressController extends ChangeNotifier {
  final AddressRemoteDataSource _dataSource = AddressRemoteDataSource();
  
  List<dynamic> addresses = [];
  Map<String, dynamic>? selectedAddress;
  bool isLoading = false;

  Future<void> fetchAddresses(int customerId) async {
    isLoading = true;
    notifyListeners();
    try {
      addresses = await _dataSource.getAddresses(customerId);
      // Automatically select default address
      if (addresses.isNotEmpty) {
        selectedAddress = addresses.firstWhere(
          (a) => a['isDefault'] == true, 
          orElse: () => addresses.first
        );
      }
    } catch (e) {
      print(e);
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addAddress(Map<String, dynamic> addressData) async {
    isLoading = true;
    notifyListeners();
    try {
      final result = await _dataSource.saveAddress(addressData);
      if (result != null) {
        await fetchAddresses(addressData['customerId']);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void selectAddress(Map<String, dynamic> address) {
    selectedAddress = address;
    notifyListeners();
  }
}
