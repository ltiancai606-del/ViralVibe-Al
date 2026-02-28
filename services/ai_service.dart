// 这是一个极简示例，帮你理解流程
import 'package:http/http.dart' as http;
import 'dart:convert';

class AIService {
  final String apiKey = '你的DeepSeek API Key';
  final String baseUrl = 'https://api.deepseek.com/v1/chat/completions';

  Future<String> getAIResponse(String prompt) async {
    final response = await http.post(
      Uri.parse(baseUrl),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $apiKey',
      },
      body: jsonEncode({
        'model': 'deepseek-chat', // 或 deepseek-coder，根据任务选择
        'messages': [
          {'role': 'user', 'content': prompt}
        ],
        'temperature': 0.7, // 控制回答的随机性
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['choices'][0]['message']['content'];
    } else {
      throw Exception('AI请求失败');
    }
  }
}
