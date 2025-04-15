//
//  FieldView.swift
//  Chesmes
//
//  Created by Ramon Jr Bahio on 4/15/25.
//

import SwiftUI

struct FieldView: View {
    var title: String
    
    @State var text: String = ""
    var body: some View {
        VStack(alignment: .leading) {
            Text(title)
                .font(.caption)
            TextField(text: $text) {
            }
            .textFieldStyle(.roundedBorder)
            .autocapitalization(.none)
            .autocorrectionDisabled()
        }
        .padding([.horizontal, .bottom])
    }
}

#Preview {
    FieldView(title: "Username")
}
