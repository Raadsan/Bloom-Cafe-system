import 'package:flutter/material.dart';
import 'features/navigation/presentation/screens/main_navigation_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Restaurant Delivery',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        fontFamily: 'Poppins',
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4c5fb3),
          primary: const Color(0xFF4c5fb3),
          surface: const Color(0xFFF8F9FA),
        ),
        useMaterial3: true,
      ),
      home: const MainNavigationScreen(),
    );
  }
}
