import 'package:flutter/material.dart';
import '../../data/datasources/scan_remote_data_source.dart';

class ScanController extends ChangeNotifier {
  final ScanRemoteDataSource _dataSource = ScanRemoteDataSource();
  
  bool isScanning = true;
  bool isLoading = false;
  String? error;

  void setScanning(bool value) {
    isScanning = value;
    notifyListeners();
  }

  void resetScanner() {
    isScanning = true;
    isLoading = false;
    error = null;
    notifyListeners();
  }

  Future<Map<String, dynamic>?> processScannedCode(String code) async {
    isLoading = true;
    error = null;
    notifyListeners();

    try {
      final table = await _dataSource.getTableByQr(code);
      
      if (table != null) {
        isLoading = false;
        notifyListeners();
        return table;
      }
      
      error = "Invalid table QR code";
    } catch (e) {
      error = "Connection error: $e";
    } finally {
      isLoading = false;
      notifyListeners();
    }
    return null;
  }
}
